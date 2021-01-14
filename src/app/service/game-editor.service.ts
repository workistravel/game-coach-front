import { Injectable } from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Card} from '../model/card';
import {Game } from '../model/game';
import {CustomHttpResponse} from '../model/custom-http-response';
import {Deck} from '../model/deck';
import {Step} from '../model/step';
import {Judgment} from '../model/judgment';

@Injectable({
  providedIn: 'root'
})
export class GameEditorService {
  private  host = environment.apiUrl;
  constructor(private http: HttpClient) { }

  public addGame(formData: FormData): Observable<Game>{
    return this.http.post<Game>(`${this.host}/game-editor/add`, formData);
  }

  public addJudgment(formData: FormData): Observable<Step> {
    return this.http.post<Step>(`${this.host}/game-editor/add-judgment`, formData)
  }

  public getGames(email: string): Observable<Game[]>{
    return this.http.get<Game[]>(`${this.host}/game-editor/getGames/${email}` );
  }

  getJudgments(stepId: string) : Observable<Judgment[]>{
    return this.http.get<Judgment[]>(`${this.host}/game-editor/get-judgments/${stepId}` );
  }

  public deleteGame(email:string, gameId: string ): Observable<CustomHttpResponse>{
    return this.http.delete<CustomHttpResponse>(`${this.host}/game-editor/delete/${email}/${gameId}`);
  }

  public deleteJudgment(id: string): Observable<CustomHttpResponse> {
    return this.http.delete<CustomHttpResponse>(`${this.host}/game-editor/delete-judgment/${id}`);
  }

  public editJudgment(formData: FormData) : Observable<Judgment>{
    return this.http.post<Judgment>(`${this.host}/game-editor/edit-judgment`, formData );
  }
  saveStep(formData: FormData): Observable<Step> {
    return this.http.post<Step>(`${this.host}/game-editor/add-deck-to-step`, formData);
  }


  public addGamesToLocalCache(response: Game[]): void{
    localStorage.setItem('games', JSON.stringify(response));
  }


}
