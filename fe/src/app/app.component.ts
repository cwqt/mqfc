import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AuthComponent } from './auth/auth.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'mqfc-fe';
  lights = [false, false, false, false];
  state: any;
  loading: boolean = false;
  token: string | null;

  constructor(private http: HttpClient, public dialog: MatDialog) {}

  ngOnInit() {
    this.getState();
  }

  async openAuthDialog() {
    const dialogRef = this.dialog.open(AuthComponent, {
    });

    dialogRef.afterClosed().subscribe((result:any) => {
      console.log('The dialog was closed');
    });
  }

  async getState() {
    this.loading = true;
    this.http
      .get(`http://localhost:3000/state`)
      .toPromise()
      .then((result: any) => {
        this.state = result;
        this.lights = Object.values(
          result.most_recent_state?.data || this.lights
        );
      })
      .finally(() => (this.loading = false));
  }

  async setState() {
    this.http.post(`/api/state`, this.lights);
  }
}
