export class Step {
  public id: string;
  public name: string;
  public title: string;
  public deckId: string;
  public judgments: [];
  constructor() {
    this.name = '';
    this.deckId = '';
    this.judgments = [];
  }
}
