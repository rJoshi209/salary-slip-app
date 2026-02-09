import { Component, signal } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule, ReactiveFormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
    protected readonly title = signal('salary-slip-app');
    salaryForm: FormGroup;
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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
        if (this.salaryForm.valid) {
            console.log(this.salaryForm.value);
        }
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

        return parts.join(' ');
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
