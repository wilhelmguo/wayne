import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ClrDatagridStateInterface } from '@clr/angular';
import { Subscription } from 'rxjs/Subscription';
import { ListServiceComponent } from './list-service/list-service.component';
import { CreateEditServiceComponent } from './create-edit-service/create-edit-service.component';

import { ServiceService } from '../../shared/client/v1/service.service';
import { PageState } from '../../shared/page/page-state';
import { Service } from '../../shared/model/v1/service';
import { MessageHandlerService } from '../../shared/message-handler/message-handler.service';
import { ConfirmationDialogService } from '../../shared/confirmation-dialog/confirmation-dialog.service';
import { ConfirmationButtons, ConfirmationState, ConfirmationTargets } from '../../shared/shared.const';
import { ConfirmationMessage } from '../../shared/confirmation-dialog/confirmation-message';

@Component({
  selector: 'wayne-service',
  templateUrl: './service.component.html',
  styleUrls: ['./service.component.scss']
})
export class ServiceComponent implements OnInit, OnDestroy {
  @ViewChild(ListServiceComponent)
  list: ListServiceComponent;
  @ViewChild(CreateEditServiceComponent)
  createEdit: CreateEditServiceComponent;

  pageState: PageState = new PageState();
  services: Service[];
  appId: string;
  componentName = '服务';

  subscription: Subscription;

  constructor(
    private route: ActivatedRoute,
    private serviceService: ServiceService,
    private messageHandlerService: MessageHandlerService,
    private deletionDialogService: ConfirmationDialogService) {
    this.subscription = deletionDialogService.confirmationConfirm$.subscribe(message => {
      if (message &&
        message.state === ConfirmationState.CONFIRMED &&
        message.source === ConfirmationTargets.SERVICE) {
        const id = message.data;
        this.serviceService.deleteById(id, 0)
          .subscribe(
            response => {
              this.messageHandlerService.showSuccess('服务删除成功！');
              this.retrieve();
            },
            error => {
              this.messageHandlerService.handleError(error);
            }
          );
      }
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.appId = params['aid'];
      if (typeof (this.appId) === 'undefined') {
        this.appId = '';
      }
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  retrieve(state?: ClrDatagridStateInterface): void {
    if (state) {
      this.pageState = PageState.fromState(state, {totalPage: this.pageState.page.totalPage, totalCount: this.pageState.page.totalCount});
    }
    this.serviceService.list(this.pageState, 'false', this.appId)
      .subscribe(
        response => {
          const data = response.data;
          this.pageState.page.totalPage = data.totalPage;
          this.pageState.page.totalCount = data.totalCount;
          this.services = data.list;
        },
        error => this.messageHandlerService.handleError(error)
      );
  }

  createService(created: boolean) {
    if (created) {
      this.retrieve();
    }
  }

  openModal(): void {
    this.createEdit.newOrEditService();
  }

  deleteService(service: Service) {
    const deletionMessage = new ConfirmationMessage(
      '删除服务确认',
      '你确认删除服务 ' + service.name + ' ？',
      service.id,
      ConfirmationTargets.SERVICE,
      ConfirmationButtons.DELETE_CANCEL
    );
    this.deletionDialogService.openComfirmDialog(deletionMessage);
  }

  editService(service: Service) {
    this.createEdit.newOrEditService(service.id);
  }
}
