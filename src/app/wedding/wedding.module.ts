import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { WEDDING_DECLARATIONS } from './wedding.declarations';
import { WeddingRoutingModule } from './wedding-routing.module';

/** Lazy-loaded at /wedding — keeps the CV's initial bundle untouched. */
@NgModule({
  declarations: WEDDING_DECLARATIONS,
  imports: [CommonModule, WeddingRoutingModule],
})
export class WeddingModule {}
