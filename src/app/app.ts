import { Component, ElementRef, signal, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
// import { initializeApp } from 'firebase/app';
// import { getFirestore } from 'firebase/firestore';
// import { getAnalytics } from 'firebase/analytics';

// const firebaseConfig = {
//     apiKey: "AIzaSyDrkphJeVH4nJoA03WJMgTxPpVJVwy365Y",
//     authDomain: "salary-slip-app-ecdb4.firebaseapp.com",
//     projectId: "salary-slip-app-ecdb4",
    
//     storageBucket: "salary-slip-app-ecdb4.firebasestorage.app",
//     messagingSenderId: "133204434143",
//     appId: "1:133204434143:web:08b3870e96450106249d6a",
//     measurementId: "G-98S8EWDR41"
// };

// const app = initializeApp(firebaseConfig);
// export const analytics = getAnalytics(app);
// export const db = getFirestore(app);
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule, ReactiveFormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
    @ViewChild('contentToConvert', { static: false }) public contentToConvert: ElementRef | undefined;
    protected readonly title = signal('salary-slip-app');
    salaryForm: FormGroup;
    months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    years = Array.from({ length: 3000 - 2000 + 1 }, (_, i) => 2000 + i);
    showForm = true;

    constructor(private fb: FormBuilder) {
        this.salaryForm = this.fb.group({
            employeeName: ['', Validators.required],
            designation: ['', Validators.required],
            employeeId: ['', Validators.required],
            accountNo: ['', Validators.required],
            daysPresent: ['', Validators.required],
            pfNo: ['', Validators.required],
            panNo: ['', Validators.required],
            aadharNo: ['', Validators.required],
            uanNo: ['', Validators.required],
            numberOfDays: ['', Validators.required],
            month: ['', Validators.required],
            year: ['', Validators.required],
            basicSalary: ['', [Validators.required, Validators.min(0)]],
            hra: ['', [Validators.required, Validators.min(0)]],
            allowances: ['', [Validators.required, Validators.min(0)]],
            pfAmount: ['', [Validators.required, Validators.min(0)]],
            tax: ['', [Validators.required, Validators.min(0)]],
            others: ['', [Validators.required, Validators.min(0)]],
        });
    }

    onSubmit() {
        this.showForm = false;
            console.log(this.salaryForm.value);
            const data = document.getElementById('contentToConvert'); // Use the ID or ElementRef

            html2canvas(data as HTMLElement).then(canvas => {
                const imgWidth = 208;
                const imgHeight = canvas.height * imgWidth / canvas.width;
                const contentDataURL = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                pdf.addImage(contentDataURL, 'PNG', 0, 0, imgWidth, imgHeight);
                pdf.save('screen-capture.pdf');
            });
    }

    resetForm() {
        this.salaryForm.reset();
        this.showForm = true;
    }

    calculateEarningsTotal(): number {
        const basicSalary = this.salaryForm.get('basicSalary')?.value || 0;
        const hra = this.salaryForm.get('hra')?.value || 0;
        const allowances = this.salaryForm.get('allowances')?.value || 0;
        return Number(basicSalary) + Number(hra) + Number(allowances);
    }

    calculateDeductionsTotal(): number {
        const pfAmount = this.salaryForm.get('pfAmount')?.value || 0;
        const tax = this.salaryForm.get('tax')?.value || 0;
        const others = this.salaryForm.get('others')?.value || 0;
        return Number(pfAmount) + Number(tax) + Number(others);
    }

    calculateNetPayTotal(): number {
        return this.calculateEarningsTotal() - this.calculateDeductionsTotal();
    }

    formatAmount(amount: number | string): string {
        if (amount === null || amount === undefined || amount === '') return '';
        const cleaned = String(amount).replace(/,/g, '').trim();
        if (cleaned === '') return '';
        const numeric = Number(cleaned);
        if (isNaN(numeric)) return '';

        const sign = numeric < 0 ? '-' : '';
        const absVal = Math.abs(numeric);

        // Ensure two decimal places (rounded)
        const fixed = absVal.toFixed(2); // e.g. "1234567.89"
        const [intPartRaw, decPart = '00'] = fixed.split('.');

        // Format integer part in Indian numbering system
        let intPart = intPartRaw;
        if (intPart.length > 3) {
            const last3 = intPart.slice(-3);
            const rest = intPart.slice(0, -3);
            const restWithCommas = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
            intPart = restWithCommas + ',' + last3;
        }

        return `${sign}${intPart}.${decPart}`;
    }

    amountToWords(amount: number): string {
        const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
        const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
        const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
        const scales = ['', 'thousand', 'lakh', 'crore'];

        if (amount === 0) return 'zero';

        const parts: string[] = [];
        let scaleIndex = 0;

        while (amount > 0) {
            const divisor = scaleIndex === 0 ? 1000 : 100;
            const remainder = amount % divisor;
            amount = Math.floor(amount / divisor);

            if (remainder > 0) {
                const words = this.convertHundreds(remainder, ones, teens, tens);
                if (scales[scaleIndex]) {
                    parts.unshift(`${words} ${scales[scaleIndex]}`);
                } else {
                    parts.unshift(words);
                }
            }
            scaleIndex++;
        }

        const resultStr = parts.join(' ');
        return resultStr.replace(/\b[a-z]/g, (char) => char.toUpperCase());
    }

    private convertHundreds(num: number, ones: string[], teens: string[], tens: string[]): string {
        const result: string[] = [];

        const hundreds = Math.floor(num / 100);
        if (hundreds > 0) {
            result.push(`${ones[hundreds]} hundred`);
        }

        const remainder = num % 100;
        if (remainder >= 10 && remainder < 20) {
            result.push(teens[remainder - 10]);
        } else {
            const ten = Math.floor(remainder / 10);
            const one = remainder % 10;
            if (ten > 0) result.push(tens[ten]);
            if (one > 0) result.push(ones[one]);
        }

        return result.join(' ');
    }

}
