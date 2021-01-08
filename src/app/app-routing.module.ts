import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {UserComponent} from './user/user.component';
import {AuthenticationGuard} from './scurity/guard/authentication.guard';
import {HomeComponent} from './home/home.component';
import {MainComponent} from './main/main.component';
import {LoginComponent} from './registration/login/login.component';
import {RegisterComponent} from './registration/register/register.component';
import {ManagementComponent} from './management/management.component';
import {CardsComponent} from './cards/cards.component';
import {CardComponent} from './card/card.component';

const routes: Routes = [
  {path: 'user/home', component: HomeComponent, canActivate: [AuthenticationGuard]},
  {path: 'user/management', component: UserComponent, canActivate: [AuthenticationGuard]},
  {path: 'cards', component: CardsComponent, canActivate: [AuthenticationGuard] ,
    children: [
      {path: 'card', component: CardComponent , canActivate: [AuthenticationGuard]}
    ]},
  {path: 'management', component: ManagementComponent, canActivate: [AuthenticationGuard]},
  {path: 'main', component: MainComponent,
    children:[
      {path: 'login', component: LoginComponent },
      {path: 'register', component: RegisterComponent }
    ]},
  {path: '', redirectTo: 'main', pathMatch: 'full'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
