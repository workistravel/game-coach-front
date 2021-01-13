import { Injectable } from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Card} from '../model/card';
import {Game } from '../model/game';
import {CustomHttpResponse} from '../model/custom-http-response';
import {Deck} from '../model/deck';
import {Step} from '../model/step';

@Injectable({
  providedIn: 'root'
})
export class GameEditorService {
  private  host = environment.apiUrl;
  constructor(private http: HttpClient) { }

  public addGame(formData: FormData): Observable<Game>{
    return this.http.post<Game>(`${this.host}/game-editor/add`, formData);
  }
  public getGames(email: string): Observable<Game[]>{
    return this.http.get<Game[]>(`${this.host}/game-editor/getGames/${email}` );
  }
  public deleteGame(email:string, gameId: string ): Observable<CustomHttpResponse>{
    return this.http.delete<CustomHttpResponse>(`${this.host}/game-editor/delete/${email}/${gameId}`);
  }
  saveStep(formData: FormData): Observable<Step> {
    return this.http.post<Step>(`${this.host}/game-editor/add-deck-to-step`, formData);
  }


  public addGamesToLocalCache(response: Game[]): void{
    localStorage.setItem('games', JSON.stringify(response));
  }


}
