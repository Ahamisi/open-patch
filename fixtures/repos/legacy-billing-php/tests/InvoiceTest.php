<?php

use Harbor\Ledger\Invoice;
use Harbor\Ledger\Payment;
use PHPUnit\Framework\TestCase;

final class InvoiceTest extends TestCase
{
    public function test_posted_invoice_accepts_matching_payment(): void
    {
        $invoice = new Invoice('INV-1', 5000, 'posted');
        $payment = new Payment();

        $this->assertSame('accepted', $payment->apply($invoice, 5000));
    }

    public function test_draft_invoice_is_rejected(): void
    {
        $invoice = new Invoice('INV-2', 5000, 'draft');
        $payment = new Payment();

        $this->assertSame('rejected: invoice is not posted', $payment->apply($invoice, 5000));
    }
}
