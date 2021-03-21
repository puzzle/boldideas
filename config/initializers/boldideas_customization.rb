# frozen_string_literal: true

Decidim::DiffCell.include Boldideas::DiffCell
Decidim::Proposals::ProposalMCell.include Boldideas::Proposals::ProposalMCell
Decidim::ParticipatoryProcesses::ProcessMCell.include Boldideas::ParticipatoryProcesses::ProcessMCell
Decidim::Proposals::Admin::ProposalNoteCreatedEvent.prepend Boldideas::Proposals::Admin::ProposalNoteCreatedEvent

module Decidim
  module Map
    module Provider
      module DynamicMap
        autoload :Swisstopo, 'decidim/map/provider/dynamic_map/swisstopo'
      end
    end
  end
end
