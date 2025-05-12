/// <reference types="@angular/localize" />

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { authInterceptor } from '../interceptor/authInterceptor/auth-interceptor.interceptor';
import { API_BASE_URL } from '../Services/api/api-client.service';
import { routes } from './app/app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { loggingInterceptor } from '../interceptor/logging/logging-interceptor.interceptor';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

bootstrapApplication(AppComponent, {
  providers: [
    provideAnimations(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, loggingInterceptor])),
    {
      provide: API_BASE_URL,
      useValue: 'https://localhost:7222',
    },
    provideCharts(withDefaultRegisterables()),
  ],
}).catch((err) => console.error(err));
