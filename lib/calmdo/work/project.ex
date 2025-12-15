defmodule Calmdo.Work.Project do
  use Ash.Resource, otp_app: :calmdo, domain: Calmdo.Work, data_layer: AshPostgres.DataLayer

  postgres do
    table "projects"
    repo Calmdo.Repo
  end

  actions do
    defaults [:read, :destroy]

    create :create do
      default_accept [:name]
    end

    update :update do
      default_accept [:name, :completed]
    end
  end

  attributes do
    uuid_primary_key :id

    attribute :name, :string do
      allow_nil? false
    end

    attribute :completed, :boolean do
      default false
    end

    create_timestamp :inserted_at
    update_timestamp :updated_at
  end
end
