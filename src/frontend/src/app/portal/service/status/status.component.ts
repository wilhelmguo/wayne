import { Component } from '@angular/core';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import { ActivatedRoute } from '@angular/router';
import { ServiceClient } from '../../../shared/client/v1/kubernetes/service';
import { KubeService } from '../../../shared/model/v1/kubernetes/service';
import { MessageHandlerService } from '../../../shared/message-handler/message-handler.service';
import { KubernetesClient } from '../../../shared/client/v1/kubernetes/kubernetes';
import { CacheService } from '../../../shared/auth/cache.service';
import { ServiceTpl } from '../../../shared/model/v1/servicetpl';
import { KubeResourceService } from '../../../shared/shared.const';

@Component({
  selector: 'status',
  templateUrl: 'status.component.html',
  styleUrls: ['status.scss']
})

export class ServiceStatusComponent {
  createAppOpened = false;
  service: KubeService;

  constructor(private messageHandlerService: MessageHandlerService,
              private serviceClient: ServiceClient,
              private kubernetesClient: KubernetesClient,
              private route: ActivatedRoute,
              public cacheService: CacheService) {
  }

  get appId(): number {
    return parseInt(this.route.parent.snapshot.params['id'], 10);
  }

  getPorts() {
    const ports = [];
    if (this.service && this.service.spec.ports) {
      for (const port of this.service.spec.ports) {
        const nodePort = port.nodePort ? port.nodePort : port.port;
        ports.push(
          `${port.targetPort}:${nodePort}/${port.protocol}`);
      }
    }
    return ports.join(',');
  }

  getSelectors() {
    const lables = [];
    if (this.service && this.service.spec.selector) {
      Object.getOwnPropertyNames(this.service.spec.selector).map(key => {
        lables.push(`${key}:${this.service.spec.selector[key]}`);
      });
    }
    return lables;
  }

  getLoadBalanceIP(): string {
    if (this.service && this.service.spec.type === 'LoadBalancer') {
      if (this.service.status && this.service.status.loadBalancer && this.service.status.loadBalancer.ingress
        && this.service.status.loadBalancer.ingress.length > 0 &&
        this.service.status.loadBalancer.ingress[0]) {
        return this.service.status.loadBalancer.ingress[0].ip;
      }
    }

    return '未分配';
  }

  newServiceStatus(cluster: string, serviceTpl: ServiceTpl) {
    this.createAppOpened = true;

    const service: KubeService = JSON.parse(serviceTpl.template);
    this.kubernetesClient.get(cluster, KubeResourceService, service.metadata.name, this.cacheService.kubeNamespace,
      this.appId.toString()).subscribe(
      response => {
        this.service = response.data;
      },
      error => {
        this.messageHandlerService.handleError(error);
      }
    );
  }


}

