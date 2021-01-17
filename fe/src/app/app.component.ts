import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { environment } from 'src/environments/environment';
import { AuthComponent } from './auth/auth.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'mqfc-fe';
  lights = [
    { checked: false },
    { checked: false },
    { checked: false },
    { checked: false },
  ];
  state: any;
  loading: boolean = false;
  token: string | null;

  constructor(private http: HttpClient, public dialog: MatDialog) {}

  ngOnInit() {
    this.getState();
  }

  async openAuthDialog() {
    const dialogRef = this.dialog.open(AuthComponent, {});

    dialogRef.afterClosed().subscribe((result: any) => {
      this.token = result.data;
    });
  }

  async getState() {
    this.loading = true;

    this.http
      .get(`${environment.api_url}/state`)
      .toPromise()
      .then((result: any) => {
        this.state = result;
        if(result.most_recent_state) {
          Object.values(result.most_recent_state.data).forEach((s, idx) => {
            this.lights[idx].checked = s as boolean;
          })
        }
      })
      .finally(() => (this.loading = false));
  }

  async setState() {
    console.log('Setting state')
    await this.http.post(`${environment.api_url}/state`, this.lights.map(l => l.checked), {
      headers: {
        Authorization: `Bearer ${this.token}`
      }
    }).toPromise();
  }
}
