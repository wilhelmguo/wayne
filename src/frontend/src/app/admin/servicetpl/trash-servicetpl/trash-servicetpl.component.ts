import { Component, OnDestroy, OnInit } from '@angular/core';
import { ClrDatagridStateInterface } from '@clr/angular';
import { Subscription } from 'rxjs/Subscription';
import { ServiceTplService } from '../../../shared/client/v1/servicetpl.service';
import { ServiceTpl } from '../../../shared/model/v1/servicetpl';
import { PageState } from '../../../shared/page/page-state';
import { MessageHandlerService } from '../../../shared/message-handler/message-handler.service';
import { ConfirmationDialogService } from '../../../shared/confirmation-dialog/confirmation-dialog.service';
import { AceEditorService } from '../../../shared/ace-editor/ace-editor.service';
import { ConfirmationButtons, ConfirmationState, ConfirmationTargets } from '../../../shared/shared.const';
import { ConfirmationMessage } from '../../../shared/confirmation-dialog/confirmation-message';
import { AceEditorMsg } from '../../../shared/ace-editor/ace-editor';

@Component({
  selector: 'trash-servicetpl',
  templateUrl: 'trash-servicetpl.component.html'
})
export class TrashServiceTplComponent implements OnInit, OnDestroy {

  serviceTpls: ServiceTpl[];
  pageState: PageState = new PageState();
  currentPage = 1;
  state: ClrDatagridStateInterface;

  subscription: Subscription;

  constructor(private serviceTplService: ServiceTplService,
              private messageHandlerService: MessageHandlerService,
              private deletionDialogService: ConfirmationDialogService,
              private aceEditorService: AceEditorService) {
    this.subscription = deletionDialogService.confirmationConfirm$.subscribe(message => {
      if (message &&
        message.state === ConfirmationState.CONFIRMED &&
        message.source === ConfirmationTargets.TRASH_SERVICE_TPL) {
        const id = message.data;
        this.serviceTplService
          .deleteById(id, 0, false)
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
    this.pageState.params['deleted'] = true;
    this.serviceTplService.listPage(this.pageState, 0)
      .subscribe(
        response => {
          const data = response.data;
          this.pageState.page.totalPage = data.totalPage;
          this.pageState.page.totalCount = data.totalCount;
          this.serviceTpls = data.list;
        },
        error => this.messageHandlerService.handleError(error)
      );
  }

  deleteServiceTpl(serviceTpl: ServiceTpl) {
    const deletionMessage = new ConfirmationMessage(
      '删除服务确认',
      '你确认永久删除服务模版 ' + serviceTpl.name + ' ？删除后将不可恢复！',
      serviceTpl.id,
      ConfirmationTargets.TRASH_SERVICE_TPL,
      ConfirmationButtons.DELETE_CANCEL
    );
    this.deletionDialogService.openComfirmDialog(deletionMessage);
  }

  tplDetail(serviceTpl: ServiceTpl) {
    this.aceEditorService.announceMessage(AceEditorMsg.Instance(serviceTpl.template, false, '详情'));
  }

  recoverServiceTpl(serviceTpl: ServiceTpl) {
    serviceTpl.deleted = false;
    this.serviceTplService.update(serviceTpl, 0)
      .subscribe(
        response => {
          this.messageHandlerService.showSuccess('服务模版恢复成功！');
          this.refresh();
        },
        error => this.messageHandlerService.handleError(error)
      );
  }
}
