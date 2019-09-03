export class Cluster {
  id: number;
  name: string;
  alias: string;
  master: string;
  metaData: string;
  kubeConfig: string;
  user: string;
  robinUrl: string;
  deleted: boolean;
  status: number;
  state: string;
  description: string;
  createTime: Date;
  checked: boolean;

  constructor(name?: string, checked?: boolean) {
    if (name) {
      this.name = name;
    }
    if (checked) {
      this.checked = checked;
    }
    this.kubeConfig = '{}';
    this.metaData = '{}';
  }
}

export class ClusterMeta {
  constructor(checked: boolean, value = 0) {
    this.checked = checked;
    this.value = value;
  }

  checked: boolean;
  value: number;
}
