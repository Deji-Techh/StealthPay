// SPDX-License-Identifier: CC0-1.0
pragma solidity 0.8.23;

/// @notice `ERC6538Registry` contract to associate Ethereum addresses with stealth meta-addresses.
/// @see ERC-6538: https://eips.ethereum.org/EIPS/eip-6538
/// @dev Deployed at deterministic address 0x6538E6bf4B0eBd30A8Ea093027Ac2422ce5d6538
/// via CREATE2 on all EVM chains.
contract ERC6538Registry {
  /// @notice Emitted when keys are registered for an address.
  /// @param registrant The address registering the keys.
  /// @param schemeId The scheme ID of the registered keys.
  /// @param stealthMetaAddress The stealth meta-address associated with the registrant.
  event KeysRegistered(
    address indexed registrant,
    uint256 indexed schemeId,
    bytes stealthMetaAddress
  );

  /// @notice Emitted when keys are unregistered for an address.
  /// @param registrant The address unregistering the keys.
  /// @param schemeId The scheme ID of the unregistered keys.
  event KeysUnregistered(
    address indexed registrant,
    uint256 indexed schemeId
  );

  /// @notice Mapping from registrant address and scheme ID to stealth meta-address.
  mapping(address => mapping(uint256 => bytes)) public stealthMetaAddress;

  /// @notice Registers keys for the caller's address.
  /// @param schemeId The scheme ID of the keys being registered.
  /// @param _stealthMetaAddress The stealth meta-address to associate with the caller.
  function registerKeys(
    uint256 schemeId,
    bytes memory _stealthMetaAddress
  ) external {
    stealthMetaAddress[msg.sender][schemeId] = _stealthMetaAddress;
    emit KeysRegistered(msg.sender, schemeId, _stealthMetaAddress);
  }

  /// @notice Registers keys on behalf of another address.
  /// @param registrant The address to register the keys for.
  /// @param schemeId The scheme ID of the keys being registered.
  /// @param _stealthMetaAddress The stealth meta-address to associate with the registrant.
  function registerKeysFor(
    address registrant,
    uint256 schemeId,
    bytes memory _stealthMetaAddress
  ) external {
    stealthMetaAddress[registrant][schemeId] = _stealthMetaAddress;
    emit KeysRegistered(registrant, schemeId, _stealthMetaAddress);
  }

  /// @notice Unregisters keys for the caller's address.
  /// @param schemeId The scheme ID of the keys being unregistered.
  function unregisterKeys(uint256 schemeId) external {
    delete stealthMetaAddress[msg.sender][schemeId];
    emit KeysUnregistered(msg.sender, schemeId);
  }
}
