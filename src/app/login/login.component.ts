import {Component, OnDestroy, OnInit} from '@angular/core';
import {AuthenticationService} from '../service/authentication.service';
import {Router} from '@angular/router';
import {NotificationService} from '../service/notification.service';
import {User} from '../model/user';
import {Subscription} from 'rxjs';
import {HttpErrorResponse, HttpResponse} from '@angular/common/http';
import {NotificationType} from '../enum/notification-type.enum';
import {HeaderType} from '../enum/header-type.enum';
import {Role} from '../enum/role.enum';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {

  public showLoading: boolean;
  private subscriptions: Subscription[] = [];
  constructor(private router: Router, private authenticationService: AuthenticationService, private notificationService: NotificationService) { }

  ngOnInit(): void {
    if (this.authenticationService.isLoggedIn()){
      this.router.navigateByUrl('/user/management')
    }else {
      this.router.navigateByUrl('/login')
    }
  }

  public onLogin(user: User): void{
    this.showLoading = true;
    this.subscriptions.push(
      this.authenticationService.login(user).subscribe(
        (response: HttpResponse<User>) => {
          const token = response.headers.get(HeaderType.JWT_TOKEN);
          this.authenticationService.saveToken(token);
          this.authenticationService.addUserToLocalCache(response.body);
          if(this.isAdmin){
            this.router.navigateByUrl('/user/management');
          }else {
            this.router.navigateByUrl('/user/home');
          }
          this.showLoading = false;
        }, (errorResponse: HttpErrorResponse ) => {
          this.sendErrorNotification(NotificationType.ERROR , errorResponse.error.message );
          this.showLoading = false;
        }
      )
    );
  }

  private sendErrorNotification(notificationType: NotificationType, message: string): void {
    if(message){
      this.notificationService.notify(notificationType, message);
    }else {
      this.notificationService.notify(notificationType, 'An error occurred. Please try again. ');
    }
  }

  public get isAdmin(): boolean{
    return this.gerUserRole() === Role.SUPER_ADMIN || this.gerUserRole() === Role.ADMIN
  }
  private gerUserRole(): string{
    return  this.authenticationService.getUserFromLocalCache().role;
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
