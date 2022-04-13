import { DatePipe, formatDate } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatCalendarCellClassFunction } from '@angular/material/datepicker';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  apiUrl = environment.apiUrl
  dateFormat = 'dd/MM/yyyy';
  rezervasyonId = '1'
  pickedDate: Date;
  pickedHour: string;
  engelDays = [0, 6]
  hours: any[] = [];
  reservedTimes: any[] = []
  reservationForm = new FormGroup({
    nameFormControl: new FormControl('', [Validators.required]),
    emailFormControl: new FormControl('', [Validators.required, Validators.email]),
    tarihFormControl: new FormControl(new Date(), [Validators.required]),
    saatlerFormControl: new FormControl('', Validators.required)
  })

  constructor(private httpClient: HttpClient, public datepipe: DatePipe) {
    this.pickedHour = '';
    this.pickedDate = new Date();
    this.setDateAndLoadHours()
    this.getEngelDays()
  }

  dateChanged = () => {
    this.setDateAndLoadHours()
    this.getEngelDays()
  }

  setDateAndLoadHours = () => {
    this.pickedDate = this.reservationForm.get('tarihFormControl')?.value
    console.log(this.pickedDate)
    if (this.pickedDate) {
      const formattedDate = this.datepipe.transform(this.pickedDate, this.dateFormat);
      this.httpClient.get(this.apiUrl + `rezervasyon/${this.rezervasyonId}/rezerve/?tarih=` + formattedDate).subscribe((hoursOfDay: any) => {
        this.hours = []
        for (let h = 9; h < 21; h++) {
          let isDisabled = hoursOfDay.indexOf(h + ':00') > -1
          let hstr: any = h;
          if (h < 10) hstr = '0' + h
          this.hours.push({ hour: hstr + ':00', disabled: isDisabled });
        }
      })
    }
  }

  getEngelDays = () => {
    this.engelDays = [0, 6]
    this.httpClient.get(this.apiUrl + `rezervasyon/${this.rezervasyonId}/engel/`).subscribe((engelDurumlar: any) => {

      engelDurumlar.map((e: any) => {
        if (e.Gun) {
          switch (e.Gun) {
            case 'Pazartesi': this.engelDays.push(1); break;
            case 'Salı': this.engelDays.push(2); break;
            case 'Çarşamba': this.engelDays.push(3); break;
            case 'Perşembe': this.engelDays.push(4); break;
            case 'Cuma': this.engelDays.push(5); break;
            // cumartesi pazar default eklendi 0,6
          }
        }
      })

    })
  }

  dateFilter = (d: Date | null): boolean => {
    const day = (d || new Date()).getDay();
    let found = this.engelDays.filter(i => i === day); // Prevent Saturday and Sunday from being selected.
    return found.length === 0;
  };
  // Validators.pattern(/^\d{1,2}\/\d{1,2}\/\d{4}$/)
  dateClass: MatCalendarCellClassFunction<Date> = (cellDate, view) => {
    // Only highligh dates inside the month view.
    if (view === 'month') {
      const date = cellDate.getDate();

      // Highlight the 1st and 20th day of each month.
      return date === 1 || date === 20 ? 'example-custom-date-class' : '';
    }

    return '';
  };

  sendReservation() {
    console.log(this.reservationForm.errors)
    let r = {
      tarih: this.datepipe.transform(this.reservationForm.get('tarihFormControl')?.value, this.dateFormat)
        + ' ' + this.reservationForm.get('saatlerFormControl')?.value,
      adsoyad: this.reservationForm.get('nameFormControl')?.value,
      eposta: this.reservationForm.get('emailFormControl')?.value,
      rezervasyonUygulamaId: 1
    }
    this.httpClient.post(this.apiUrl + 'rezervasyon/kaydet', r)
      .subscribe(result => {
        if (result) {
          alert('Rezervasyonunuz yapıldı.')
          this.reservationForm.reset()
          this.reservationForm.markAsPristine()
          this.reservationForm.markAsUntouched()

        }
        else {
          alert('Rezervasyonunuz alınırken bir sorun oluştu.')
        }
      })
  }
}
