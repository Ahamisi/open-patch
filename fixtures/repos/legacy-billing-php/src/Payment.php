<?php

namespace Harbor\Ledger;

final class Payment
{
    public function apply(Invoice $invoice, int $amountCents): string
    {
        if ($invoice->status() !== 'posted') {
            return 'rejected: invoice is not posted';
        }

        if ($amountCents !== $invoice->amountCents()) {
            return 'rejected: amount mismatch';
        }

        return 'accepted';
    }
}
