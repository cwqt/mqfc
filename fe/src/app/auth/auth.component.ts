import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent implements OnInit {
  loading: boolean = false;
  password:string;
  error:string

  constructor(private http:HttpClient, private dialogRef: MatDialogRef<AuthComponent>) { }

  ngOnInit(): void {
  }

  authenticate() {
    this.loading = true;
    this.http
      .post(`http://localhost:3000/token`, { password: this.password })
      .toPromise()
      .then(data => {
        this.dialogRef.close(data);
      })
      .catch((error:HttpErrorResponse) => this.error = JSON.stringify(error.error))
      .finally(() => this.loading = false);
  }
}
