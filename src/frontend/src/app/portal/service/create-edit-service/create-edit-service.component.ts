import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { ServiceService } from '../../../shared/client/v1/service.service';
import { CreateEditResource } from '../../../shared/base/resource/create-edit-resource';
import { AuthService } from '../../../shared/auth/auth.service';
import { MessageHandlerService } from '../../../shared/message-handler/message-handler.service';
import { Service } from '../../../shared/model/v1/service';

@Component({
  selector: 'create-edit-service',
  templateUrl: 'create-edit-service.component.html',
  styleUrls: ['create-edit-service.scss']
})
export class CreateEditServiceComponent extends CreateEditResource implements OnInit {
  defaultClusterNum = 1;
  constructor(
    public serviceService: ServiceService,
    public authService: AuthService,
    public messageHandlerService: MessageHandlerService) {
    super(serviceService, authService, messageHandlerService);
    this.registResource(new Service);
    this.registResourceType('负载均衡');
  }

  ngOnInit(): void {

  }
}

