import { Component, ViewChild, ElementRef, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { ResourceService, ToasterService, ServerResponse, ConfigService, NavigationHelperService } from '@sunbird/shared';
import { Router, ActivatedRoute } from '@angular/router';
import { OrgManagementService } from '../../services';
import { IImpressionEventInput, IInteractEventEdata, IInteractEventObject } from '@sunbird/telemetry';
import { UserService } from '@sunbird/core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import * as _ from 'lodash-es';
/**
 * This component helps to upload bulk organizations data (csv file)
 *
 * This component also creates a unique process id on success upload of csv file
 */
@Component({
  selector: 'app-organization',
  templateUrl: './organization-upload.component.html'
})
export class OrganizationUploadComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('inputbtn') inputbtn: ElementRef;
  @ViewChild('modal') modal;
  /**
* reference for ActivatedRoute
*/
  public activatedRoute: ActivatedRoute;
  /**
 * To show/hide loader
 */
  showLoader = false;
  /**
* contains upload instructions in an array
*/
  orgUploadInstructions: Array<any>;
  /**
   * To call resource service which helps to use language constant
   */
  public resourceService: ResourceService;
  /**
 * To call org-management service which helps to upload bulk data
 */
  public orgManagementService: OrgManagementService;
  /**
 * reference of config service.
 */
  public config: ConfigService;
  /**
  * Contains unique process id
  */
  processId: string;
  /**
  * Contains uploaded fileName
  */
  fileName: string;
  /**
* Contains redirect url
*/
  redirectUrl: string;
  /**
   * To show toaster(error, success etc) after any API calls
  */
  private toasterService: ToasterService;
  /**
	 * telemetryImpression
	*/
  telemetryImpression: IImpressionEventInput;
  orgUploadInteractEdata: IInteractEventEdata;
  downloadSampleOrgCSVInteractEdata: IInteractEventEdata;
  telemetryInteractObject: IInteractEventObject;
  public unsubscribe$ = new Subject<void>();
  csvOptions = {
    fieldSeparator: ',',
    quoteStrings: '"',
    decimalseparator: '.',
    showLabels: true,
    headers: []
  };
  constructor(orgManagementService: OrgManagementService, activatedRoute: ActivatedRoute, toasterService: ToasterService,
    config: ConfigService, resourceService: ResourceService, public userService: UserService, private router: Router,
    public navigationhelperService: NavigationHelperService) {
    this.activatedRoute = activatedRoute;
    this.orgManagementService = orgManagementService;
    this.resourceService = resourceService;
    this.config = config;
    this.toasterService = toasterService;
  }
  /**
* This method defines array of instructions to be displayed
*/
  ngOnInit() {
    document.body.classList.add('no-scroll'); // This is a workaround  we need to remove it when library add support to remove body scroll
    this.activatedRoute.data.subscribe(data => {
      if (data.redirectUrl) {
        this.redirectUrl = data.redirectUrl;
      } else {
        this.redirectUrl = '/home';
      }
    });
    this.orgUploadInstructions = [
      { instructions: this.resourceService.frmelmnts.instn.t0013 },
      { instructions: this.resourceService.frmelmnts.instn.t0002 },
      { instructions: this.resourceService.frmelmnts.instn.t0007 },
      { instructions: this.resourceService.frmelmnts.instn.t0021 },
      {
        instructions: this.resourceService.frmelmnts.instn.t0022,
        subinstructions: [
          { instructions: this.resourceService.frmelmnts.instn.t0023 },
          { instructions: this.resourceService.frmelmnts.instn.t0024 },
          { instructions: this.resourceService.frmelmnts.instn.t0025 },
          { instructions: this.resourceService.frmelmnts.instn.t0026 },
          { instructions: this.resourceService.frmelmnts.instn.t0027 },
          { instructions: this.resourceService.frmelmnts.instn.t0028 },
          { instructions: this.resourceService.frmelmnts.instn.t0029 },
          { instructions: this.resourceService.frmelmnts.instn.t0030 },
          { instructions: this.resourceService.frmelmnts.instn.t0031 },
          { instructions: this.resourceService.frmelmnts.instn.t0032 },
          { instructions: this.resourceService.frmelmnts.instn.t0049 },
          { instructions: this.resourceService.frmelmnts.instn.t0050 },
          { instructions: this.resourceService.frmelmnts.instn.t0078 },
          { instructions: this.resourceService.frmelmnts.instn.t0079 }
        ]
      }
    ];
    this.setInteractEventData();
  }
  /**
 * This method helps to redirect to the parent component
 * page, i.e, bulk upload page
 */
  public redirect() {
    this.fileName = '';
    this.processId = '';
    this.router.navigate([this.redirectUrl]);
  }
  /**
 * This method helps to call uploadOrg method to upload a csv file
 */
  openImageBrowser(inputbtn) {
    inputbtn.click();
  }
  /**
 * This method helps to upload a csv file and return process id
 */
  uploadOrg(file) {
    if (file[0] && file[0].name.match(/.(csv)$/i)) {
      this.showLoader = true;
      const formData = new FormData();
      formData.append('org', file[0]);
      const fd = formData;
      this.orgManagementService.bulkOrgUpload(fd).pipe(
        takeUntil(this.unsubscribe$))
        .subscribe(
          (apiResponse: ServerResponse) => {
            this.showLoader = false;
            this.processId = apiResponse.result.processId;
            this.toasterService.success(this.resourceService.messages.smsg.m0031);
            this.fileName = file[0].name;
          },
          err => {
            this.showLoader = false;
            const errorMsg = _.get(err, 'error.params.errmsg') ? _.get(err, 'error.params.errmsg').split(/\../).join('.<br/>') :
              this.resourceService.messages.fmsg.m0051;
            this.toasterService.error(errorMsg);
          });
    } else if (file[0] && !(file[0].name.match(/.(csv)$/i))) {
      this.showLoader = false;
      this.toasterService.error(this.resourceService.messages.stmsg.m0080);
    }
  }
  ngOnDestroy() {
    document.body.classList.remove('no-scroll'); // This is a workaround we need to remove it when library add support to remove body scroll
    this.modal.deny();
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngAfterViewInit () {
    setTimeout(() => {
      this.telemetryImpression = {
        context: {
          env: this.activatedRoute.snapshot.data.telemetry.env
        },
        edata: {
          type: this.activatedRoute.snapshot.data.telemetry.type,
          pageid: 'profile-bulk-upload-organization-upload',
          subtype: this.activatedRoute.snapshot.data.telemetry.subtype,
          uri: this.router.url,
          duration: this.navigationhelperService.getPageLoadTime()
        }
      };
    });
  }

  setInteractEventData() {
    this.orgUploadInteractEdata = {
      id: 'upload-org',
      type: 'click',
      pageid: 'profile-read'
    };
    this.downloadSampleOrgCSVInteractEdata = {
      id: 'download-sample-org-csv',
      type: 'click',
      pageid: 'profile-read'
    };
    this.telemetryInteractObject = {
      id: this.userService.userid,
      type: 'User',
      ver: '1.0'
    };
  }
}
