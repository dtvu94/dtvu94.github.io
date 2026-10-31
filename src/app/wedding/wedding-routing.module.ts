import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { WeddingDetailComponent } from './detail/wedding-detail.component';
import { WeddingEditorComponent } from './editor/wedding-editor.component';
import { WeddingGalleryComponent } from './gallery/wedding-gallery.component';

const routes: Routes = [
  { path: '', component: WeddingGalleryComponent },
  // Before ':id', which would take "editor" for a design id.
  { path: 'editor', component: WeddingEditorComponent },
  { path: ':id', component: WeddingDetailComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class WeddingRoutingModule {}
