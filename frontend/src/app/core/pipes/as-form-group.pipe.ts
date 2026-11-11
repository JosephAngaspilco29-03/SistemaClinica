import { Pipe, PipeTransform } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Pipe({ name: 'asFormGroup', standalone: true })
export class AsFormGroupPipe implements PipeTransform {
  transform(value: any): FormGroup {
    return value as FormGroup;
  }
}
