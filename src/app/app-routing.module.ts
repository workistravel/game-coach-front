import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {LoginComponent} from './login/login.component';
import {RegisterComponent} from './register/register.component';
import {UserComponent} from './user/user.component';
import {AuthenticationGuard} from './guard/authentication.guard';
import {HomeComponent} from './home/home.component';

const routes: Routes = [
  {path: 'login', component: LoginComponent},
  {path: 'register', component: RegisterComponent},
  {path: 'user/home', component: HomeComponent, canActivate: [AuthenticationGuard]},
  {path: 'user/management', component: UserComponent, canActivate: [AuthenticationGuard]},
  {path: '', redirectTo: 'login', pathMatch: 'full'},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
