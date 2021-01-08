import {Component, OnDestroy, OnInit} from '@angular/core';
import {User} from '../../model/user';
import {NotificationType} from '../../enum/notification-type.enum';
import {HttpErrorResponse} from '@angular/common/http';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {SubSink} from 'subsink';
import {Router} from '@angular/router';
import {AuthenticationService} from '../../service/authentication.service';
import {NotificationService} from '../../service/notification.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit, OnDestroy {

  public showLoading = false;
  private subs = new SubSink();
  registerForm: FormGroup;

  constructor(private router: Router, private authenticationService: AuthenticationService, private notificationService: NotificationService) { }

  ngOnInit(): void {
    this.showLoading = false;
    this.registerForm = new FormGroup({
      email: new FormControl('',[Validators.email, Validators.required, Validators.pattern('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$')] ),
      firstName: new FormControl('',[Validators.minLength(3), Validators.required] ),
      lastName: new FormControl('',[Validators.minLength(3), Validators.required] )});
  }
  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }


  public onRegister(): void{
    this.showLoading = true;
    const user= {...this.registerForm.value}
    this.registerForm.reset()
    this.subs.add(
      this.authenticationService.register(user).subscribe(
        (response: User) => {
          this.showLoading = false;
          this.sendNotification(NotificationType.SUCCESS , `A new account was created for ${response.firstName}. Please check your email for to log in.` );
        }, (errorResponse: HttpErrorResponse ) => {
          this.sendNotification(NotificationType.ERROR , errorResponse.error.message );
          this.showLoading = false;
        }
      )
    );
    this.showLoading = false;
    this.clickButton('closeRegister');
    this.registerForm.reset()
  }

  private sendNotification(notificationType: NotificationType, message: string): void {
    if(message){
      this.notificationService.notify(notificationType, message);
    }else {
      this.notificationService.notify(notificationType, 'An error occurred. Please try again. ');
    }
  }

  public clickButton(buttonId: string): void{
    document.getElementById(buttonId).click();
  }

  cleanForm() {
    this.registerForm.reset();
    this.clickButton('closeRegister');
    this.router.navigateByUrl('main');
  }

  goToLogin() {
    this.registerForm.reset();
    this.clickButton('closeRegister');
    this.router.navigateByUrl('main/login');
  }
}
