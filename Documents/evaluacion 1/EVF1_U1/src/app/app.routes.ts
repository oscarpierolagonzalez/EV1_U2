import { Routes } from '@angular/router';
import { HomeComponent } from './componentes/home/home.component';
import { ContactoComponent } from './componentes/contacto/contacto.component';

export const routes: Routes = [

    {path: 'home' , component:HomeComponent},
    {path:'sobre-mi' , component:HomeComponent},
     {path: 'mis-habilidades' , component:HomeComponent},
    {path: 'contacto' , component:ContactoComponent},

    // {path: '' , redirectTo: '/home'},
];
