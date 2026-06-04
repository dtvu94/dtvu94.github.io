import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { WeddingDetailComponent } from './detail/wedding-detail.component';
import { WeddingGalleryComponent } from './gallery/wedding-gallery.component';

const routes: Routes = [
  { path: '', component: WeddingGalleryComponent },
  { path: ':id', component: WeddingDetailComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class WeddingRoutingModule {}
