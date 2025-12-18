defmodule CalmdoWeb.FeatureCase do
  use ExUnit.CaseTemplate

  using do
    quote do
      use Wallaby.Feature

      alias Calmdo.Repo
    end
  end

  setup tags do
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Calmdo.Repo)

    unless tags[:async] do
      Ecto.Adapters.SQL.Sandbox.mode(Calmdo.Repo, {:shared, self()})
    end

    metadata = Phoenix.Ecto.SQL.Sandbox.metadata_for(Calmdo.Repo, self())
    {:ok, session} = Wallaby.start_session(metadata: metadata)

    on_exit(fn ->
      try do
        Wallaby.end_session(session)
      rescue
        _ -> :ok
      end
    end)

    {:ok, session: session}
  end
end
