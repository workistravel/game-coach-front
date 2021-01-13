import {
  AfterContentChecked,
  AfterContentInit,
  AfterViewInit,
  Component,
  DoCheck,
  ElementRef, Input,
  OnChanges,
  OnDestroy,
  OnInit, Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {User} from '../model/user';
import {NotificationType} from '../enum/notification-type.enum';
import {Router} from '@angular/router';
import {AuthenticationService} from '../service/authentication.service';
import {NotificationService} from '../service/notification.service';
import {Role} from '../enum/role.enum';
import {SubSink} from 'subsink';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']

})
export class MainComponent implements OnInit, OnDestroy{
  @Input() presenceLogin: boolean
  public currentUser = new User();
  private subs = new SubSink();
  public presence = false;
  constructor(private router: Router, private authenticationService: AuthenticationService, private notificationService: NotificationService) { }

  updatePresence(event) {
    if (this.authenticationService.isLoggedIn()) {
      this.currentUser = this.authenticationService.getUserFromLocalCache();
      this.presence = event;
    }
  }
  ngOnInit(): void {
      if (this.authenticationService.isLoggedIn()) {
        this.currentUser = this.authenticationService.getUserFromLocalCache();
        this.presence = true;
      }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
  public get isHr(): boolean{
    return  this.gerUserRole() === Role.HR;
  }

  public get isAdmin(): boolean{
    if(this.presence){
      return this.gerUserRole() === Role.SUPER_ADMIN || this.gerUserRole() === Role.ADMIN;
    }
    return false;
  }
  public get isUser(): boolean{
    if(this.presence) {
      return this.gerUserRole() === Role.USER;
    }
    return false;
  }
  private gerUserRole(): string{
    if(this.presence) {
      return this.authenticationService.getUserFromLocalCache().role;
    }
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
    this.currentUser = null;
    this.presence=false;
    this.router.navigateByUrl('/main');
    this.sendNotification(NotificationType.SUCCESS, `You've been successfully logged out`);
  }





  public clickButton(buttonId: string): void{
    document.getElementById(buttonId).click();
  }

  // goToManagement() {
  //   this.router.navigateByUrl('/management');
  // }

  goToHome() {
    this.router.navigateByUrl('/home');
  }



}
