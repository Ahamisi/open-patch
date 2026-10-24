<?php

require __DIR__ . '/../src/Invoice.php';
require __DIR__ . '/../src/Payment.php';

use Harbor\Ledger\Invoice;
use Harbor\Ledger\Payment;

$invoice = new Invoice('INV-1042', 129900, 'posted');
$payment = new Payment();

header('Content-Type: text/plain; charset=utf-8');
echo $payment->apply($invoice, 129900);
