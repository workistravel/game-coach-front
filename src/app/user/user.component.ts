import {Component, OnDestroy, OnInit} from '@angular/core';
import {BehaviorSubject, Subscription} from 'rxjs';
import {User} from '../model/user';
import {UserService} from '../service/user.service';
import {NotificationService} from '../service/notification.service';
import {NotificationType} from '../enum/notification-type.enum';
import {HttpErrorResponse, HttpEvent, HttpEventType} from '@angular/common/http';
import {NgForm} from '@angular/forms';
import {CustomHttpResponse} from '../model/custom-http-response';
import {AuthenticationService} from '../service/authentication.service';
import {Router} from '@angular/router';
import {FileUploadStatus} from '../model/file-upload.status';
import {Role} from '../enum/role.enum';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit, OnDestroy {
  private titleSubject = new BehaviorSubject<string>('Users');
  public titleAction$ = this.titleSubject.asObservable();
  public users: User[];
  public user: User;
  public refreshing: boolean;
  public selectedUser: User;
  public profileImage: File;
  public fileName: string;
  private subscriptions: Subscription[] = [];
  public editUser = new User();
  private currentUsername: string;
  public fileStatus = new FileUploadStatus();



  constructor(private userService: UserService ,
              private notificationService: NotificationService,
              private authenticationService: AuthenticationService,
              private router: Router) { }

  public changeTitle(title: string): void{
      this.titleSubject.next(title);
  }

  ngOnInit(): void {
    this.user = this.authenticationService.getUserFromLocalCache();
    if (this.authenticationService.isLoggedIn()){
      if(this.isAdmin){
        this.getUsers(true);
      }
    }if(!this.isAdmin || !this.isSuperAdmin){
      this.router.navigateByUrl('/user/home');
    }
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  public getUsers(showNotification: boolean): void{
    this.refreshing = true;
    this.subscriptions.push(
      this.userService.getUsers().subscribe(
        (response: User[]) => {
          this.userService.addUsersToLocaleCache(response);
          this.users = response;
          this.refreshing = false;
          if(showNotification){
            this.sendNotification(NotificationType.SUCCESS, `${response.length} user(s) loaded successfully`);
          }
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message)
          this.refreshing = false;
        }
      )
    );

  }


  public get isSuperAdmin(): boolean{
    return  this.gerUserRole() === Role.SUPER_ADMIN;
  }
  public get isAdmin(): boolean{
    return this.gerUserRole() === Role.ADMIN ||  this.gerUserRole() === Role.SUPER_ADMIN;
  }

  private gerUserRole(): string{
    return  this.authenticationService.getUserFromLocalCache().role;
  }

  public onSelectUser(selectedUser: User): void{
    this.selectedUser = selectedUser;
    this.clickButton('openUserInfo')
  }

  public onProfileImageChange(fileName: string, file: File): void{
    this.fileName = fileName;
    this.profileImage = file;
  }

  public saveNewUser(): void {
    this.clickButton('new-user-save');
  }

  public onAddNewUser(userForm: NgForm):void{
    const formData = this.userService.createUserFromDate(null, userForm.value,this.profileImage);
    this.subscriptions.push(
      this.userService.addUser(formData).subscribe(
        (response: User) =>{
          this.clickButton('new-user-close');
          this.getUsers(false);
          this.fileName = null;
          this.profileImage = null;
          userForm.reset();
          this.sendNotification(NotificationType.SUCCESS,`${response.firstName}  ${response.lastName} added successfully` )
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message)
        }
      )
    );
  }

  public searchUsers(searchTerm: string): void{
    const results: User[] = [];
    const  str = searchTerm;
    console.log(str);
    for (const user of this.userService.getUsersFromLocaleCache()){
        if(user.firstName.toLowerCase().indexOf(str) !== -1 ||
          user.lastName.toLowerCase().indexOf(str) !== -1 ||
          user.username.toLowerCase().indexOf(str) !== -1 ||
          user.email.toLowerCase().indexOf(str) !== -1  ||
          user.userId.toLowerCase().indexOf(str) !== -1){
        results.push(user);
        }
    }
    this.users = results;
    if(results.length === 0  || !searchTerm){
      this.users = this.userService.getUsersFromLocaleCache();
    }
  }

  public onUpdateUser(): void{
    const formData = this.userService.createUserFromDate(this.currentUsername, this.editUser,this.profileImage);
    this.subscriptions.push(
      this.userService.updateUser(formData).subscribe(
        (response: User) =>{
          this.clickButton('closeEditUserModalButton');
          this.getUsers(false);
          this.fileName = null;
          this.profileImage = null;
          this.sendNotification(NotificationType.SUCCESS,`${response.firstName}  ${response.lastName} updated successfully` )
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message)
        }
      )
    );
  }
  public profileImageImage(): void{
    this.clickButton('profile-image-input');
  }


  public onUpdateProfileImage(): void{
    const formData = new FormData();
    formData.append('username', this.user.username);
    formData.append('profileImage', this.profileImage);
    this.subscriptions.push(
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

  public onLogOut(): void {
    this.authenticationService.logOut();
    this.router.navigateByUrl('/login');
    this.sendNotification(NotificationType.SUCCESS, `You've been successfully logged out`);
  }

  public onUpdateCurrentUser(user: User): void {
    this.refreshing = true;
    if(user.active === undefined){
      user.email = this.user.email;
      user.role = this.user.role;
      user.authorities = this.user.authorities;
      user.active = this.user.active;
      user.nonLocked = this.user.nonLocked;
    }
    this.currentUsername = this.authenticationService.getUserFromLocalCache().username
    const formData = this.userService.createUserFromDate(this.currentUsername, user, this.profileImage);
    this.subscriptions.push(
      this.userService.updateUser(formData).subscribe(
        (response: User) =>{
          this.authenticationService.addUserToLocalCache(response);
          this.getUsers(false);
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

  public onResetPassword(emailForm: NgForm){
   this.refreshing =true;
   const emailAddress = emailForm.value['reset-password-email'];
   this.subscriptions.push(
     this.userService.resetPassword(emailAddress).subscribe(
       (response: CustomHttpResponse) =>{
         this.sendNotification(NotificationType.SUCCESS,   response.message.toLowerCase() );
         this.refreshing =false;
       },
       (errorResponse: HttpErrorResponse) => {
         this.sendNotification(NotificationType.WARNING, errorResponse.error.message);
         this.refreshing =false;
       },
       () => emailForm.reset()
     )
   );
  }
  public  onDeleteUser(email: string): void {
    this.subscriptions.push(
      this.userService.deleteUser(email).subscribe(
        (response: CustomHttpResponse) =>  {
          this.sendNotification(NotificationType.SUCCESS,   response.message.toLowerCase() );
          this.getUsers(true)
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message)
        }
      ));
  }
  private onEditUser(editUser: User): void{
    this.editUser = editUser;
     this.currentUsername = editUser.username;
     this.clickButton('openUserEdit');

  }
  private sendNotification(notificationType: NotificationType, message: string): void {
    if(message){
      this.notificationService.notify(notificationType, message);
    }else {
      this.notificationService.notify(notificationType, 'An error occurred. Please try again. ');
    }
  }

  private clickButton(buttonId: string): void{
      document.getElementById(buttonId).click();
  }

  private reportUploadProgress(event: HttpEvent<any>) {
    switch (event.type) {
      case HttpEventType.UploadProgress:
        this.fileStatus.percentage = Math.round(100 * event.loaded / event.total);
        this.fileStatus.status = 'progress';
        break;
      case HttpEventType.Response:
        if(event.status === 200){
          this.user.profileImageUrl = `${event.body.profileImageUrl}?time=${new Date().getTime()}`;
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
}
