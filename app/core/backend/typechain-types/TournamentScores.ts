/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumberish,
  BytesLike,
  FunctionFragment,
  Result,
  Interface,
  EventFragment,
  AddressLike,
  ContractRunner,
  ContractMethod,
  Listener,
} from "ethers";
import type {
  TypedContractEvent,
  TypedDeferredTopicFilter,
  TypedEventLog,
  TypedLogDescription,
  TypedListener,
  TypedContractMethod,
} from "./common";

export declare namespace TournamentScores {
  export type MatchRecordStruct = {
    matchId: BigNumberish;
    tournamentId: BigNumberish;
    player1Name: string;
    player2Name: string;
    player1Score: BigNumberish;
    player2Score: BigNumberish;
    winnerName: string;
    timestamp: BigNumberish;
    recordedBy: AddressLike;
  };

  export type MatchRecordStructOutput = [
    matchId: bigint,
    tournamentId: bigint,
    player1Name: string,
    player2Name: string,
    player1Score: bigint,
    player2Score: bigint,
    winnerName: string,
    timestamp: bigint,
    recordedBy: string
  ] & {
    matchId: bigint;
    tournamentId: bigint;
    player1Name: string;
    player2Name: string;
    player1Score: bigint;
    player2Score: bigint;
    winnerName: string;
    timestamp: bigint;
    recordedBy: string;
  };
}

export interface TournamentScoresInterface extends Interface {
  getFunction(
    nameOrSignature:
      | "addAuthorizedRecorder"
      | "authorizedRecorders"
      | "getTournamentMatchCount"
      | "getTournamentMatches"
      | "isMatchRecorded"
      | "matchExists"
      | "owner"
      | "recordMatch"
      | "removeAuthorizedRecorder"
      | "tournamentMatches"
  ): FunctionFragment;

  getEvent(nameOrSignatureOrTopic: "MatchRecorded"): EventFragment;

  encodeFunctionData(
    functionFragment: "addAuthorizedRecorder",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "authorizedRecorders",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "getTournamentMatchCount",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "getTournamentMatches",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "isMatchRecorded",
    values: [BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "matchExists",
    values: [BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: "owner", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "recordMatch",
    values: [
      BigNumberish,
      BigNumberish,
      string,
      string,
      BigNumberish,
      BigNumberish,
      string
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "removeAuthorizedRecorder",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "tournamentMatches",
    values: [BigNumberish, BigNumberish]
  ): string;

  decodeFunctionResult(
    functionFragment: "addAuthorizedRecorder",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "authorizedRecorders",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getTournamentMatchCount",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getTournamentMatches",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "isMatchRecorded",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "matchExists",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "recordMatch",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "removeAuthorizedRecorder",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "tournamentMatches",
    data: BytesLike
  ): Result;
}

export namespace MatchRecordedEvent {
  export type InputTuple = [
    tournamentId: BigNumberish,
    matchId: BigNumberish,
    player1Name: string,
    player2Name: string,
    player1Score: BigNumberish,
    player2Score: BigNumberish,
    winnerName: string,
    recordedBy: AddressLike
  ];
  export type OutputTuple = [
    tournamentId: bigint,
    matchId: bigint,
    player1Name: string,
    player2Name: string,
    player1Score: bigint,
    player2Score: bigint,
    winnerName: string,
    recordedBy: string
  ];
  export interface OutputObject {
    tournamentId: bigint;
    matchId: bigint;
    player1Name: string;
    player2Name: string;
    player1Score: bigint;
    player2Score: bigint;
    winnerName: string;
    recordedBy: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export interface TournamentScores extends BaseContract {
  connect(runner?: ContractRunner | null): TournamentScores;
  waitForDeployment(): Promise<this>;

  interface: TournamentScoresInterface;

  queryFilter<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;
  queryFilter<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;

  on<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  on<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  once<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  once<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  listeners<TCEvent extends TypedContractEvent>(
    event: TCEvent
  ): Promise<Array<TypedListener<TCEvent>>>;
  listeners(eventName?: string): Promise<Array<Listener>>;
  removeAllListeners<TCEvent extends TypedContractEvent>(
    event?: TCEvent
  ): Promise<this>;

  addAuthorizedRecorder: TypedContractMethod<
    [_recorder: AddressLike],
    [void],
    "nonpayable"
  >;

  authorizedRecorders: TypedContractMethod<
    [arg0: AddressLike],
    [boolean],
    "view"
  >;

  getTournamentMatchCount: TypedContractMethod<
    [_tournamentId: BigNumberish],
    [bigint],
    "view"
  >;

  getTournamentMatches: TypedContractMethod<
    [_tournamentId: BigNumberish],
    [TournamentScores.MatchRecordStructOutput[]],
    "view"
  >;

  isMatchRecorded: TypedContractMethod<
    [_tournamentId: BigNumberish, _matchId: BigNumberish],
    [boolean],
    "view"
  >;

  matchExists: TypedContractMethod<
    [arg0: BigNumberish, arg1: BigNumberish],
    [boolean],
    "view"
  >;

  owner: TypedContractMethod<[], [string], "view">;

  recordMatch: TypedContractMethod<
    [
      _tournamentId: BigNumberish,
      _matchId: BigNumberish,
      _player1Name: string,
      _player2Name: string,
      _player1Score: BigNumberish,
      _player2Score: BigNumberish,
      _winnerName: string
    ],
    [void],
    "nonpayable"
  >;

  removeAuthorizedRecorder: TypedContractMethod<
    [_recorder: AddressLike],
    [void],
    "nonpayable"
  >;

  tournamentMatches: TypedContractMethod<
    [arg0: BigNumberish, arg1: BigNumberish],
    [
      [
        bigint,
        bigint,
        string,
        string,
        bigint,
        bigint,
        string,
        bigint,
        string
      ] & {
        matchId: bigint;
        tournamentId: bigint;
        player1Name: string;
        player2Name: string;
        player1Score: bigint;
        player2Score: bigint;
        winnerName: string;
        timestamp: bigint;
        recordedBy: string;
      }
    ],
    "view"
  >;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "addAuthorizedRecorder"
  ): TypedContractMethod<[_recorder: AddressLike], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "authorizedRecorders"
  ): TypedContractMethod<[arg0: AddressLike], [boolean], "view">;
  getFunction(
    nameOrSignature: "getTournamentMatchCount"
  ): TypedContractMethod<[_tournamentId: BigNumberish], [bigint], "view">;
  getFunction(
    nameOrSignature: "getTournamentMatches"
  ): TypedContractMethod<
    [_tournamentId: BigNumberish],
    [TournamentScores.MatchRecordStructOutput[]],
    "view"
  >;
  getFunction(
    nameOrSignature: "isMatchRecorded"
  ): TypedContractMethod<
    [_tournamentId: BigNumberish, _matchId: BigNumberish],
    [boolean],
    "view"
  >;
  getFunction(
    nameOrSignature: "matchExists"
  ): TypedContractMethod<
    [arg0: BigNumberish, arg1: BigNumberish],
    [boolean],
    "view"
  >;
  getFunction(
    nameOrSignature: "owner"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "recordMatch"
  ): TypedContractMethod<
    [
      _tournamentId: BigNumberish,
      _matchId: BigNumberish,
      _player1Name: string,
      _player2Name: string,
      _player1Score: BigNumberish,
      _player2Score: BigNumberish,
      _winnerName: string
    ],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "removeAuthorizedRecorder"
  ): TypedContractMethod<[_recorder: AddressLike], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "tournamentMatches"
  ): TypedContractMethod<
    [arg0: BigNumberish, arg1: BigNumberish],
    [
      [
        bigint,
        bigint,
        string,
        string,
        bigint,
        bigint,
        string,
        bigint,
        string
      ] & {
        matchId: bigint;
        tournamentId: bigint;
        player1Name: string;
        player2Name: string;
        player1Score: bigint;
        player2Score: bigint;
        winnerName: string;
        timestamp: bigint;
        recordedBy: string;
      }
    ],
    "view"
  >;

  getEvent(
    key: "MatchRecorded"
  ): TypedContractEvent<
    MatchRecordedEvent.InputTuple,
    MatchRecordedEvent.OutputTuple,
    MatchRecordedEvent.OutputObject
  >;

  filters: {
    "MatchRecorded(uint256,uint256,string,string,uint256,uint256,string,address)": TypedContractEvent<
      MatchRecordedEvent.InputTuple,
      MatchRecordedEvent.OutputTuple,
      MatchRecordedEvent.OutputObject
    >;
    MatchRecorded: TypedContractEvent<
      MatchRecordedEvent.InputTuple,
      MatchRecordedEvent.OutputTuple,
      MatchRecordedEvent.OutputObject
    >;
  };
}
