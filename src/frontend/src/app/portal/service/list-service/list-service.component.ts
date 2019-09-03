import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { ClrDatagridStateInterface } from '@clr/angular';
import { Subscription } from 'rxjs/Subscription';
import { PublishServiceTplComponent } from '../publish-tpl/publish-tpl.component';
import { ServiceStatusComponent } from '../status/status.component';
import { ActivatedRoute, Router } from '@angular/router';
import { ServiceTplService } from '../../../shared/client/v1/servicetpl.service';
import { ServiceTpl } from '../../../shared/model/v1/servicetpl';
import { Service } from '../../../shared/model/v1/service';
import { Page } from '../../../shared/page/page-state';
import { ServiceService } from '../../../shared/client/v1/service.service';
import { TplDetailService } from '../../../shared/tpl-detail/tpl-detail.service';
import { MessageHandlerService } from '../../../shared/message-handler/message-handler.service';
import { AceEditorService } from '../../../shared/ace-editor/ace-editor.service';
import { DiffService } from '../../../shared/diff/diff.service';
import { AuthService } from '../../../shared/auth/auth.service';
import { ConfirmationDialogService } from '../../../shared/confirmation-dialog/confirmation-dialog.service';
import {
  ConfirmationButtons,
  ConfirmationState,
  ConfirmationTargets,
  ResourcesActionType,
  TemplateState
} from '../../../shared/shared.const';
import { AceEditorMsg } from '../../../shared/ace-editor/ace-editor';
import { PublishStatus } from '../../../shared/model/v1/publish-status';
import { ConfirmationMessage } from '../../../shared/confirmation-dialog/confirmation-message';

@Component({
  selector: 'list-service',
  templateUrl: 'list-service.component.html',
  styleUrls: ['list-service.scss']
})
export class ListServiceComponent implements OnInit, OnDestroy {
  selected: ServiceTpl[] = [];
  @Input() showState: object;
  @ViewChild(PublishServiceTplComponent)
  publishTpl: PublishServiceTplComponent;
  @ViewChild(ServiceStatusComponent)
  serviceStatus: ServiceStatusComponent;

  @Input() services: Service[];
  @Input() serviceTpls: ServiceTpl[];
  @Input() page: Page;
  @Input() appId: number;
  state: ClrDatagridStateInterface;
  currentPage = 1;

  @Output() paginate = new EventEmitter<ClrDatagridStateInterface>();
  @Output() serviceTab = new EventEmitter<number>();
  @Output() cloneTpl = new EventEmitter<ServiceTpl>();
  subscription: Subscription;

  constructor(private serviceTplService: ServiceTplService,
              private serviceService: ServiceService,
              private tplDetailService: TplDetailService,
              private messageHandlerService: MessageHandlerService,
              private route: ActivatedRoute,
              private aceEditorService: AceEditorService,
              private router: Router,
              private diffService: DiffService,
              public authService: AuthService,
              private deletionDialogService: ConfirmationDialogService) {
    this.subscription = deletionDialogService.confirmationConfirm$.subscribe(message => {
      if (message &&
        message.state === ConfirmationState.CONFIRMED &&
        message.source === ConfirmationTargets.SERVICE_TPL) {
        const tplId = message.data;
        this.serviceTplService.deleteById(tplId, this.appId)
          .subscribe(
            response => {
              this.messageHandlerService.showSuccess('负载均衡模版删除成功！');
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

  diffTpl() {
    this.diffService.diff(this.selected);
  }

  pageSizeChange(pageSize: number) {
    this.state.page.to = pageSize - 1;
    this.state.page.size = pageSize;
    this.currentPage = 1;
    this.paginate.emit(this.state);
  }

  cloneServiceTpl(tpl: ServiceTpl) {
    this.cloneTpl.emit(tpl);
  }

  detailServiceTpl(tpl: ServiceTpl) {
    this.aceEditorService.announceMessage(AceEditorMsg.Instance(JSON.parse(tpl.template), false));
  }

  tplDetail(tpl: ServiceTpl) {
    this.tplDetailService.openModal(tpl.description);
  }

  publishServiceTpl(tpl: ServiceTpl) {
    this.serviceService.getById(tpl.serviceId, this.appId).subscribe(
      response => {
        const service = response.data;
        this.publishTpl.newPublishTpl(service, tpl, ResourcesActionType.PUBLISH);
      },
      error => {
        this.messageHandlerService.handleError(error);
      }
    );

  }

  serviceState(status: PublishStatus, tpl: ServiceTpl) {
    if (status.cluster && status.state !== TemplateState.NOT_FOUND) {
      this.serviceStatus.newServiceStatus(status.cluster, tpl);
    }

  }

  offlineServiceTpl(tpl: ServiceTpl) {
    this.serviceService.getById(tpl.serviceId, this.appId).subscribe(
      response => {
        const service = response.data;
        this.publishTpl.newPublishTpl(service, tpl, ResourcesActionType.OFFLINE);
      },
      error => {
        this.messageHandlerService.handleError(error);
      }
    );

  }

  deleteServiceTpl(tpl: ServiceTpl): void {
    const deletionMessage = new ConfirmationMessage(
      '删除负载均衡模版确认',
      `你确认删除负载均衡模版${tpl.name}？`,
      tpl.id,
      ConfirmationTargets.SERVICE_TPL,
      ConfirmationButtons.DELETE_CANCEL
    );
    this.deletionDialogService.openComfirmDialog(deletionMessage);
  }

  refresh(state?: ClrDatagridStateInterface) {
    this.state = state;
    this.paginate.emit(state);
  }

  published(success: boolean) {
    if (success) {
      this.refresh();
    }
  }

}
