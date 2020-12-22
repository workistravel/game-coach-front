import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {AuthenticationService} from './service/authentication.service';
import {UserService} from './service/user.service';
import {AuthInterceptor} from './intrceptor/auth.interceptor';
import {AuthenticationGuard} from './guard/authentication.guard';
import {NotificationModule} from './notification.module';
import {NotificationService} from './service/notification.service';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { UserComponent } from './user/user.component';
import {FormsModule} from '@angular/forms';
import { HomeComponent } from './home/home.component';


@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    UserComponent,
    HomeComponent
  ],
  imports: [
    FormsModule,
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    NotificationModule
  ],
  providers: [NotificationService,AuthenticationGuard, AuthenticationService, UserService,
    {provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true}],
  bootstrap: [AppComponent]
})
export class AppModule { }
