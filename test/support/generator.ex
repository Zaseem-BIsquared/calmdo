defmodule Calmdo.Generator do
  @moduledoc "Data generation for tests"

  use Ash.Generator

  @doc """
  Generates project changesets with the `:create` action.

  ## Extra Options

  - `:seed?` - If present, will seed data instead of using actions to insert data - to test the edge cases, by inserting wrong data.
  """
  def project(opts \\ []) do
    if opts[:seed?] do
      seed_generator(
        %Calmdo.Work.Project{name: sequence(:project_name, &"Project #{&1}")},
        overrides: opts
      )
    else
      changeset_generator(
        Calmdo.Work.Project,
        :create,
        defaults: [name: sequence(:project_name, &"Project #{&1}")],
        overrides: opts
      )
    end
  end
end
