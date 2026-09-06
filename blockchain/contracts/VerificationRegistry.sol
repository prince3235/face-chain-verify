// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title VerificationRegistry
/// @notice Stores tamper-evident hashes of discovered posts/data so they can
///         be independently re-verified later. Deliberately minimal: it does
///         not store the underlying content itself (only its hash + a
///         metadata pointer), keeping on-chain storage cheap and avoiding
///         putting personal data on a public, permanent ledger.
contract VerificationRegistry {
    struct Record {
        bytes32 hash;
        string metadataURI;
        uint256 timestamp;
        address submitter;
    }

    Record[] private records;

    event RecordSubmitted(
        uint256 indexed recordId,
        bytes32 hash,
        address indexed submitter
    );

    /// @notice Anchor a new hash on-chain.
    /// @param hash SHA-256 (or similar) hash of the off-chain content.
    /// @param metadataURI A pointer to the source content (URL, IPFS URI, etc).
    /// @return recordId The index of the newly created record.
    function submitRecord(bytes32 hash, string calldata metadataURI)
        external
        returns (uint256 recordId)
    {
        records.push(
            Record({
                hash: hash,
                metadataURI: metadataURI,
                timestamp: block.timestamp,
                submitter: msg.sender
            })
        );
        recordId = records.length - 1;
        emit RecordSubmitted(recordId, hash, msg.sender);
    }

    /// @notice Fetch a previously anchored record by id.
    function getRecord(uint256 recordId)
        external
        view
        returns (
            bytes32 hash,
            string memory metadataURI,
            uint256 timestamp,
            address submitter
        )
    {
        require(recordId < records.length, "VerificationRegistry: invalid recordId");
        Record storage r = records[recordId];
        return (r.hash, r.metadataURI, r.timestamp, r.submitter);
    }

    /// @notice Total number of records anchored so far.
    function recordCount() external view returns (uint256) {
        return records.length;
    }

    /// @notice Recompute-and-compare helper: checks whether `hash` matches
    ///         the hash stored at `recordId`, so callers can re-verify
    ///         without pulling the full struct off-chain first.
    function verifyRecord(uint256 recordId, bytes32 hash) external view returns (bool) {
        require(recordId < records.length, "VerificationRegistry: invalid recordId");
        return records[recordId].hash == hash;
    }
}
