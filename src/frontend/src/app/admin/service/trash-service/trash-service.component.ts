import { Component, OnDestroy, OnInit } from '@angular/core';
import { ClrDatagridStateInterface } from '@clr/angular';
import { Subscription } from 'rxjs/Subscription';
import { ServiceService } from '../../../shared/client/v1/service.service';
import { Service } from '../../../shared/model/v1/service';
import { PageState } from '../../../shared/page/page-state';
import { MessageHandlerService } from '../../../shared/message-handler/message-handler.service';
import { ConfirmationDialogService } from '../../../shared/confirmation-dialog/confirmation-dialog.service';
import { AceEditorService } from '../../../shared/ace-editor/ace-editor.service';
import { ConfirmationButtons, ConfirmationState, ConfirmationTargets } from '../../../shared/shared.const';
import { ConfirmationMessage } from '../../../shared/confirmation-dialog/confirmation-message';
import { AceEditorMsg } from '../../../shared/ace-editor/ace-editor';

@Component({
  selector: 'trash-service',
  templateUrl: 'trash-service.component.html'
})
export class TrashServiceComponent implements OnInit, OnDestroy {

  services: Service[];
  pageState: PageState = new PageState();
  currentPage = 1;
  state: ClrDatagridStateInterface;

  subscription: Subscription;

  constructor(private serviceService: ServiceService,
              private messageHandlerService: MessageHandlerService,
              private deletionDialogService: ConfirmationDialogService,
              private aceEditorService: AceEditorService) {
    this.subscription = deletionDialogService.confirmationConfirm$.subscribe(message => {
      if (message &&
        message.state === ConfirmationState.CONFIRMED &&
        message.source === ConfirmationTargets.TRASH_SERVICE) {
        const id = message.data;
        this.serviceService.deleteById(id, 0, false)
          .subscribe(
            response => {
              this.messageHandlerService.showSuccess('服务删除成功！');
              this.refresh();
            },
            error => {
              this.messageHandlerService.handleError(error);
            }
          );
      }
    });
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  pageSizeChange(pageSize: number) {
    this.state.page.to = pageSize - 1;
    this.state.page.size = pageSize;
    this.currentPage = 1;
    this.refresh(this.state);
  }

  refresh(state?: ClrDatagridStateInterface) {
    if (state) {
      this.state = state;
      this.pageState = PageState.fromState(state, {totalPage: this.pageState.page.totalPage, totalCount: this.pageState.page.totalCount});
    }
    this.serviceService.list(this.pageState, 'true')
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

  deleteService(service: Service) {
    const deletionMessage = new ConfirmationMessage(
      '删除服务确认',
      '你确认永久删除服务 ' + service.name + ' ？删除后将不可恢复！',
      service.id,
      ConfirmationTargets.TRASH_SERVICE,
      ConfirmationButtons.DELETE_CANCEL
    );
    this.deletionDialogService.openComfirmDialog(deletionMessage);
  }

  recoverService(service: Service) {
    service.deleted = false;
    this.serviceService
      .update(service)
      .subscribe(
        response => {
          this.messageHandlerService.showSuccess('服务恢复成功！');
          this.refresh();
        },
        error => this.messageHandlerService.handleError(error)
      );
  }

  detailMetaDataTpl(tpl: string) {
    this.aceEditorService.announceMessage(AceEditorMsg.Instance(tpl, false, '元数据查看'));
  }
}
