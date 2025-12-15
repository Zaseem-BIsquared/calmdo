defmodule Calmdo.Repo do
  use Ecto.Repo,
    otp_app: :calmdo,
    adapter: Ecto.Adapters.Postgres
end
