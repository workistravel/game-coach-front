import {EventEmitter, Injectable, Output} from '@angular/core';
import { environment } from '../../environments/environment';
import { JwtHelperService } from "@auth0/angular-jwt";
import {HttpClient, HttpResponse} from '@angular/common/http';
import {Observable} from 'rxjs';
import {User} from '../model/user';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  public  host = environment.apiUrl;
  private token: string;
  private loggedInUsername: string;
  private helper = new JwtHelperService();
  constructor(private http: HttpClient) { }

 public login(user: User): Observable<HttpResponse<User> >{
     return this.http.post<User>(`${this.host}/user/login`, user, {observe: 'response'});
 }

  public register(user: User): Observable<User >{
    return this.http.post<User >(`${this.host}/user/register`, user);
  }


  public logOut(): void{
    this.token = null;
    this.loggedInUsername = null;
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('users');
    localStorage.removeItem('decks')
  }
  public saveToken(token: string): void{
    this.token = token;
    localStorage.setItem('token', token);
  }
  public removeUsersFromLocalCache(){
    localStorage.removeItem('users');
  }

  public addUserToLocalCache(user: User): void{
    localStorage.setItem('user', JSON.stringify(user));
  }

  public getUserFromLocalCache(): User{
    return JSON.parse(localStorage.getItem('user' ));
  }

  public loadToken(): void{
    this.token = localStorage.getItem('token');
  }

  public getToken(): string{
    return this.token;
  }

  public isLoggedIn(): boolean{
    this.loadToken();
    if (this.token !== null && this.token !== ''){
        if (this.helper.decodeToken(this.token).sub !== null || ''){
            if (!this.helper.isTokenExpired(this.token)){
              this.loggedInUsername = this.helper.decodeToken(this.token).sub;
              return true;
            }
        }
    }else {
      this.logOut();
      return false;
    }
    return
  }

}
