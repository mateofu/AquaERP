-- Refresh tokens are opaque random values and their hashes must be unique.
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");
