import {Component, OnDestroy, OnInit} from '@angular/core';
import {AuthenticationService} from '../service/authentication.service';
import {Router} from '@angular/router';
import {NotificationService} from '../service/notification.service';
import {User} from '../model/user';
import {Subscription} from 'rxjs';
import {HttpErrorResponse} from '@angular/common/http';
import {NotificationType} from '../enum/notification-type.enum';


@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit, OnDestroy {
  public showLoading: boolean;
  private subscriptions: Subscription[] = [];
  constructor(private router: Router, private authenticationService: AuthenticationService, private notificationService: NotificationService) { }

  ngOnInit(): void {
    if (this.authenticationService.isLoggedIn()){
      this.router.navigateByUrl('/user/management');
    }
  }

  public onRegister(user: User): void{
    this.showLoading = true;
    this.subscriptions.push(
      this.authenticationService.register(user).subscribe(
        (response: User) => {
          this.showLoading = false;
          this.sendNotification(NotificationType.SUCCESS , `A new account was created for ${response.firstName}. Please check your email for to log in.` );
          this.router.navigateByUrl('/login');
        }, (errorResponse: HttpErrorResponse ) => {
          this.sendNotification(NotificationType.ERROR , errorResponse.error.message );
          this.showLoading = false;
          this.router.navigateByUrl('/login');
        }
      )
    );
  }

  private sendNotification(notificationType: NotificationType, message: string): void {
    if(message){
      this.notificationService.notify(notificationType, message);
    }else {
      this.notificationService.notify(notificationType, 'An error occurred. Please try again. ');
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

}
