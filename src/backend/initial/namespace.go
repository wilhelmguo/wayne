package initial

import (
	"time"

	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/wait"

	"github.com/Qihoo360/wayne/src/backend/client"
	"github.com/Qihoo360/wayne/src/backend/models"
	"github.com/Qihoo360/wayne/src/backend/util/logs"
)

func EnsureNamespaces() {
	// 定期更新检查新集群的 namespace 是否被创建
	go wait.Forever(ensureNamespaces, 30*time.Second)
}

func ensureNamespaces() {
	namespaces, err := models.NamespaceModel.GetAll(false)
	if err != nil {
		logs.Error("Get all namespaces error.", err)
		return
	}

	for _, ns := range namespaces {
		client.Managers().Range(func(key, value interface{}) bool {
			kubeManager := value.(*client.ClusterManager)
			kubeClient := kubeManager.Client

			_, err = kubeClient.CoreV1().Namespaces().Get(ns.KubeNamespace, metav1.GetOptions{})
			if err != nil {
				if errors.IsNotFound(err) {
					// 未找到相关的命名空间，开始创建
					newNamespace := &v1.Namespace{
						ObjectMeta: metav1.ObjectMeta{
							Name: ns.KubeNamespace,
							Labels: map[string]string{
								"kubernetes.io/manager": "wayne",
							},
						},
					}
					_, err := kubeClient.CoreV1().Namespaces().Create(newNamespace)
					if err != nil {
						logs.Error("Create namespace %s on cluster error.", ns.KubeNamespace, key, err)
						return true
					}

				} else {
					logs.Error("Get namespace %s on cluster error.", ns.KubeNamespace, key, err)
					return true
				}
			}

			logs.Info("Ensure namespace %s on cluster %s success.", ns.KubeNamespace, key)
			return true
		})

	}

}
