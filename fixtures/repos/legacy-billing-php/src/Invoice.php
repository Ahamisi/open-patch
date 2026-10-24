<?php

namespace Harbor\Ledger;

final class Invoice
{
    private string $id;
    private int $amountCents;
    private string $status;

    public function __construct(string $id, int $amountCents, string $status = 'draft')
    {
        $this->id = $id;
        $this->amountCents = $amountCents;
        $this->status = $status;
    }

    public function id(): string
    {
        return $this->id;
    }

    public function amountCents(): int
    {
        return $this->amountCents;
    }

    public function status(): string
    {
        return $this->status;
    }

    public function markPosted(): void
    {
        if ($this->amountCents <= 0) {
            throw new \InvalidArgumentException('Invoice amount must be positive.');
        }

        $this->status = 'posted';
    }
}
