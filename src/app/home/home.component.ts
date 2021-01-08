import {Component, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {AuthenticationService} from '../service/authentication.service';
import {User} from '../model/user';
import {NotificationType} from '../enum/notification-type.enum';
import {NotificationService} from '../service/notification.service';
import {Role} from '../enum/role.enum';
import {FormControl, FormGroup, NgForm, Validators} from '@angular/forms';
import {UserService} from '../service/user.service';
import {SubSink} from 'subsink';
import {CustomHttpResponse} from '../model/custom-http-response';
import {HttpErrorResponse, HttpEvent, HttpEventType, HttpResponse} from '@angular/common/http';
import {FileUploadStatus} from '../model/file-upload.status';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  public users: User[];
  public currentUser: User;
  public presence: boolean;
  public refreshing: boolean;
  private profileImage: File;
  public fileName: string;
  private currentEmail: string;
  public fileStatus = new FileUploadStatus();
  private subs = new SubSink();
  passwordForm: FormGroup;

  constructor(private router: Router,
              private authenticationService: AuthenticationService ,
              private notificationService: NotificationService,
              private userService: UserService ,) { }

  ngOnInit(): void {
  this.passwordForm = new FormGroup({
    // , Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])[a-zA-Z0-9]+$')
    oldPassword: new FormControl('',[Validators.minLength(1), Validators.required]),
    password2: new FormControl('',[Validators.minLength(1), Validators.required]),
    password1: new FormControl('', [Validators.minLength(1), Validators.required])});
    if (this.authenticationService.isLoggedIn()){
      this.currentUser = this.authenticationService.getUserFromLocalCache();
      this.presence=true;
    }else {
      this.router.navigateByUrl('/main')
    }
  }
  ngOnDestroy(): void {
     this.passwordForm.reset()
    }

  private sendNotification(notificationType: NotificationType, message: string): void {
    if(message){
      this.notificationService.notify(notificationType, message);
    }else {
      this.notificationService.notify(notificationType, 'An error occurred. Please try again. ');
    }
  }
  public onLogOut(): void {
    this.authenticationService.logOut();
    this.router.navigateByUrl('main');
    this.sendNotification(NotificationType.SUCCESS, `You've been successfully logged out`);
  }

  onUpdatePassword() {
    this.refreshing =true;
    const formData = this.userService.createPasswordForm(this.currentUser.email, this.passwordForm.value['oldPassword'] , this.passwordForm.value['password1'] );
    this.subs.add(
      this.userService.changePassword(formData).subscribe(
        (response: CustomHttpResponse)=>{
          this.sendNotification(NotificationType.SUCCESS,   response.message.toLowerCase() );
          this.onLogOut();
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.WARNING, errorResponse.error.message);
          this.refreshing =false;
          this.passwordForm.reset();
        },
        () => this.passwordForm.reset()
      )
    );
    this.refreshing =false;
    this.passwordForm.reset();
  }




  public get isUser(): boolean{
    if(this.presence) {
      return this.gerUserRole() === Role.USER;
    }
    return false;
  }
  public get isHr(): boolean{
    if(this.presence) {
      return this.gerUserRole() === Role.HR;
    }
    return false;
  }
  public get isSuperAdmin(): boolean{
    if(this.presence) {
      return this.gerUserRole() === Role.SUPER_ADMIN;
    }
  }
  public get isAdmin(): boolean{
    if(this.presence){
      return this.gerUserRole() === Role.SUPER_ADMIN || this.gerUserRole() === Role.ADMIN;
    }
    return false;
  }

  private gerUserRole(): string{
    return  this.authenticationService.getUserFromLocalCache().role;
  }
  public onUpdateCurrentUser(user: User): void {
    this.refreshing = true;
     if(this.isUser){
       user.role = this.currentUser.role;
       user.nonLocked = this.currentUser.nonLocked;
       user.active = this.currentUser.active;
     }
    this.currentEmail = this.authenticationService.getUserFromLocalCache().email
    const formData = this.userService.createUserFromDate(this.currentEmail, user, this.profileImage);
    this.subs.add(
      this.userService.updateUser(formData).subscribe(
        (response: User) =>{
          this.authenticationService.addUserToLocalCache(response);
          this.fileName = null;
          this.profileImage = null;
          this.sendNotification(NotificationType.SUCCESS,`${response.firstName}  ${response.lastName} updated successfully` );
          this.refreshing = false;
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message)
        }
      )
    );

  }
  public onUpdateProfileImage(): void{
    const formData = new FormData();
    formData.append('email', this.currentUser.email);
    formData.append('profileImage', this.profileImage);
    this.subs.add(
      this.userService.updateProfileImage(formData).subscribe(
        (event: HttpEvent<any>) =>{
          this.reportUploadProgress(event);
        },

        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
          this.fileStatus.status = 'done';
        }
      )
    );
  }
  private reportUploadProgress(event: HttpEvent<any>) {
    switch (event.type) {
      case HttpEventType.UploadProgress:
        this.fileStatus.percentage = Math.round(100 * event.loaded / event.total);
        this.fileStatus.status = 'progress';
        break;
      case HttpEventType.Response:
        if(event.status === 200){
          this.currentUser.profileImageUrl = `${event.body.profileImageUrl}?time=${new Date().getTime()}`;
          this.sendNotification(NotificationType.SUCCESS,`${event.body.firstName}\'s profile image update successfully` );
          this.fileStatus.status = 'done';
          break;
        }else {
          this.sendNotification(NotificationType.ERROR,`Unable to upload image. Please try again` );
          break;
        }
      default:
        `Finished all processes`;
    }
  }
  public onProfileImageChange(fileName: string, file: File): void{
    this.fileName = fileName;
    this.profileImage = file;
  }

  private clickButton(buttonId: string): void{
    document.getElementById(buttonId).click();
  }

  public profileImageImage(): void{
    this.clickButton('profile-image-input');
  }
}
