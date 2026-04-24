import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { LoginComponent } from './auth/login.component';
import { ShellComponent } from './layout/shell.component';
import { HomeComponent } from './dashboard/home.component';
import { StationProfileComponent } from './station/station-profile.component';
import { DriverProfileComponent } from './driver/driver-profile.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: HomeComponent },
      { path: 'station/:stationId', component: StationProfileComponent },
      { path: 'driver/:userId', component: DriverProfileComponent },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
