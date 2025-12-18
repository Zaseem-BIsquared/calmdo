ExUnit.start()
Ecto.Adapters.SQL.Sandbox.mode(Calmdo.Repo, :manual)

# Start Wallaby after ExUnit and Sandbox setup
{:ok, _} = Application.ensure_all_started(:wallaby)
Application.put_env(:wallaby, :base_url, CalmdoWeb.Endpoint.url())
