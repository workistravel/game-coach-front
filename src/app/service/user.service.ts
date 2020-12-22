import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import {HttpClient, HttpErrorResponse, HttpEvent, HttpResponse} from '@angular/common/http';
import { Observable} from 'rxjs';
import {User} from '../model/user';
import {CustomHttpResponse} from '../model/custom-http-response';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private  host = environment.apiUrl;
  constructor(private http: HttpClient) { }

  public getUsers(): Observable<User[]>{
    return this.http.get<User[]>(`${this.host}/user/list`);
  }

  public addUser(formData: FormData): Observable<any>{
    return this.http.post<User>(`${this.host}/user/add`, formData);
  }

  public updateUser(formData: FormData): Observable<User>{
    return this.http.post<User>(`${this.host}/user/update`, formData);
  }

  public resetPassword(email: string): Observable<CustomHttpResponse>{
    return this.http.get<CustomHttpResponse>(`${this.host}/user/resetpassword/${email}`);
  }

  public updateProfileImage(formData: FormData): Observable<HttpEvent<User>>{
    return this.http.post<User>(`${this.host}/user/updateProfileImage`, formData,
      {reportProgress: true,
              observe: 'events'
      });
  }

  public deleteUser(email: string): Observable<CustomHttpResponse>{
    return this.http.delete<CustomHttpResponse>(`${this.host}/user/delete/${email}`);
  }

  public addUsersToLocaleCache(users: User[]): void{
    localStorage.setItem('users', JSON.stringify(users));
  }

  public getUsersFromLocaleCache(): User[]{
    if(localStorage.getItem('users')){
     return  JSON.parse(localStorage.getItem('users'));
    }
    return null;
  }

  public createUserFromDate(loggedInUsername: string, user: User, profileImage: File): FormData{
    const formData = new FormData();
    formData.append('currentUsername', loggedInUsername );
    formData.append('firstName', user.firstName);
    formData.append('lastName', user.lastName );
    formData.append('username', user.username );
    formData.append('email', user.email );
    formData.append('role', user.role );
    formData.append('profileImageUrl', user.profileImageUrl );
    formData.append('isActive', JSON.stringify(user.active) );
    formData.append('isNonLocked', JSON.stringify(user.nonLocked) );
    return formData;
  }
}
