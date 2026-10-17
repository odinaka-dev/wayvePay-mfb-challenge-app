import { useQuery } from "@tanstack/react-query";

import { getBanks, getUserDetails } from "@/services/app.service";

export function useAccount() {
  return useQuery({
    queryKey: ["get-user-data"],
    queryFn: ({ signal }) => getUserDetails(signal),
  });
}

export function useBanks() {
  return useQuery({
    queryKey: ["banks"],
    queryFn: ({ signal }) => getBanks(signal),
    staleTime: Infinity,
  });
}
