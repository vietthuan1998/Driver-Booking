export type RootStackParamList = {
  MainTabs: undefined;
  TripDetail: { tripId: string };
  Stats: undefined;
  History: { month?: Date } | undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Trips: undefined;
  Stats: undefined;
  Vehicle: undefined;
  Profile: undefined;
};
