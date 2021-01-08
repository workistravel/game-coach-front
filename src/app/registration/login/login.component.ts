import {Component, Directive, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {User} from '../../model/user';
import {SubSink} from 'subsink';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {AuthenticationService} from '../../service/authentication.service';
import {NotificationService} from '../../service/notification.service';
import {NotificationType} from '../../enum/notification-type.enum';
import {HttpErrorResponse, HttpResponse} from '@angular/common/http';
import {HeaderType} from '../../enum/header-type.enum';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent implements OnInit, OnDestroy {
  @Output() onAdd: EventEmitter<boolean>  = new EventEmitter<boolean>();
  public showLoading: boolean;
  public presenceLogin = false;
  private subs = new SubSink();
  loginForm: FormGroup;
  constructor(private router: Router,
              private authenticationService: AuthenticationService,
              private notificationService: NotificationService) { }


  ngOnInit(): void {
    this.loginForm = new FormGroup({
      email: new FormControl('',[ Validators.required]),  //Validators.email
      password: new FormControl(null, [Validators.minLength(1), Validators.required])});
  }
  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private sendNotification(notificationType: NotificationType, message: string): void {
    if(message){
      this.notificationService.notify(notificationType, message);
    }else {
      this.notificationService.notify(notificationType, 'An error occurred. Please try again. ');
    }
  }

  public onLogin(): void{
    this.showLoading = true;
    const user = {...this.loginForm.value};
    this.loginForm.reset();
    this.subs.add(
      this.authenticationService.login(user).subscribe(
        (response: HttpResponse<User>) => {
          const token = response.headers.get(HeaderType.JWT_TOKEN);
          this.authenticationService.saveToken(token);
          this.authenticationService.addUserToLocalCache(response.body);
          this.presenceLogin = true;
          this.onAdd.emit(this.presenceLogin);
          this.sendNotification(NotificationType.SUCCESS, `Привет  ${response.body.firstName}`);
        }, (errorResponse: HttpErrorResponse ) => {
          this.sendNotification(NotificationType.ERROR , errorResponse.error.message );
          this.showLoading = false;
          this.presenceLogin= false;
        }
      ),


    );
    this.showLoading = false;
    this.clickButton('closeLogin');

  }


  public clickButton(buttonId: string): void{
    document.getElementById(buttonId).click();
    this.loginForm.reset();

  }

  cleanForm() {
    this.onAdd.emit(this.presenceLogin);
    this.loginForm.reset();
    this.router.navigateByUrl('/main');
  }

  goToRegistration() {
    this.loginForm.reset();
    this.clickButton('closeLogin');
    this.router.navigateByUrl('main/register');
  }
}
