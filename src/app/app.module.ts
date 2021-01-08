import { BrowserModule } from '@angular/platform-browser';
import {LOCALE_ID, NgModule} from '@angular/core';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {AuthenticationService} from './service/authentication.service';
import {UserService} from './service/user.service';
import {AuthInterceptor} from './scurity/intrceptor/auth.interceptor';
import {AuthenticationGuard} from './scurity/guard/authentication.guard';
import {NotificationModule} from './notification.module';
import {NotificationService} from './service/notification.service';
import { UserComponent } from './user/user.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { HomeComponent } from './home/home.component';
import { MainComponent } from './main/main.component';
import { LoginComponent } from './registration/login/login.component';
import { RegisterComponent } from './registration/register/register.component';
import { ManagementComponent } from './management/management.component';
import { registerLocaleData } from '@angular/common';
import localeRu from '@angular/common/locales/ru';
import { CardsComponent } from './cards/cards.component';
import { CardComponent } from './card/card.component';
import {CardService} from './service/card.service';

registerLocaleData(localeRu, 'ru');

@NgModule({
  declarations: [
    AppComponent,
    UserComponent,
    HomeComponent,
    MainComponent,
    LoginComponent,
    RegisterComponent,
    ManagementComponent,
    CardsComponent,
    CardComponent
  ],
    imports: [
        FormsModule,
        BrowserModule,
        AppRoutingModule,
        HttpClientModule,
        NotificationModule,
        ReactiveFormsModule
    ],
  providers: [NotificationService,AuthenticationGuard, AuthenticationService, CardService, UserService,
    {provide: LOCALE_ID, useValue: 'ru'},
    {provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true}],
  bootstrap: [AppComponent]
})
export class AppModule { }
