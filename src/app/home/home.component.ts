import {Component, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {AuthenticationService} from '../service/authentication.service';
import {User} from '../model/user';
import {NotificationType} from '../enum/notification-type.enum';
import {NotificationService} from '../service/notification.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  private user: User;

  constructor(private router: Router, private authenticationService: AuthenticationService ,private notificationService: NotificationService) { }

  ngOnInit(): void {
    if (this.authenticationService.isLoggedIn()){
      this.router.navigateByUrl('/user/home')
      this.user = this.authenticationService.getUserFromLocalCache();
    }else {
      this.router.navigateByUrl('/login')
    }
  }
  ngOnDestroy(): void {
  }

  private sendErrorNotification(notificationType: NotificationType, message: string): void {
    if(message){
      this.notificationService.notify(notificationType, message);
    }else {
      this.notificationService.notify(notificationType, 'An error occurred. Please try again. ');
    }
  }
}
